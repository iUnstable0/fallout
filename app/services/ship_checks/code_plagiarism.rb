# frozen_string_literal: true

module ShipChecks
  module CodePlagiarism
    DEFINITION = { key: :code_plagiarism, label: "Source files are original", deps: [ :repo_tree ], visibility: :internal }.freeze

    CATEGORIES = {
      code: %w[.ino .py .c .cpp .h .js .ts .rs .go],
      pcb: %w[.kicad_pro .kicad_sch .kicad_pcb],
      eda: %w[.epro .eprj],
      cad: %w[.step .stp]
    }.freeze

    SAMPLES_PER_FILE = 3
    MAX_FILES = 5
    MIN_LINE_LENGTH = 15
    MAX_QUERY_LENGTH = 256

    def self.call(ctx)
      tree = ctx.repo_tree
      return skip(ctx.non_github_repo? ? "Skipped (non-GitHub repository)" : "Repository not accessible") if tree.nil?

      repo_nwo = ctx.repo_meta&.dig("full_name")
      return skip("Repository metadata not available") unless repo_nwo

      files = select_files(tree)
      return skip("No checkable source files found") if files.empty?

      files.each do |path|
        content = ctx.file_content(path)
        next unless content&.valid_encoding?

        match_repo = check_file(content, path, repo_nwo)
        next unless match_repo

        # Early exit — first flagged file is enough
        return ShipCheckService::CheckResult.new(
          key: "code_plagiarism", label: DEFINITION[:label],
          status: :warn, message: "#{File.basename(path)} matches #{match_repo}", visibility: :internal
        )
      end

      ShipCheckService::CheckResult.new(
        key: "code_plagiarism", label: DEFINITION[:label],
        status: :passed, message: nil, visibility: :internal
      )
    rescue StandardError
      skip("Code plagiarism check unavailable")
    end

    # Pick up to MAX_FILES, distributed across categories
    def self.select_files(tree)
      by_category = CATEGORIES.transform_values do |exts|
        tree.select { |p| exts.include?(File.extname(p).downcase) }
      end.reject { |_, v| v.empty? }

      return [] if by_category.empty?

      selected = []
      per_category = [ (MAX_FILES.to_f / by_category.size).ceil, 2 ].min

      by_category.each_value do |paths|
        selected.concat(paths.sample(per_category))
        break if selected.size >= MAX_FILES
      end

      selected.first(MAX_FILES)
    end

    # Take 3 samples from different parts of the file, search each on GitHub.
    # If 2+ samples match the same external repo, return that repo's name.
    def self.check_file(content, _path, repo_nwo)
      lines = content.lines.map(&:strip).select { |l| meaningful_line?(l) }
      return nil if lines.size < SAMPLES_PER_FILE

      samples = pick_samples(lines)
      repo_hits = Hash.new(0)

      samples.each do |line|
        repos = search_github(line, repo_nwo)
        repos.each { |r| repo_hits[r] += 1 }
      end

      match = repo_hits.find { |_, count| count >= 2 }
      match&.first
    end

    # Pick samples from top, middle, and bottom thirds of the file
    def self.pick_samples(lines)
      third = lines.size / 3
      [
        lines[0...third],
        lines[third...(third * 2)],
        lines[(third * 2)..]
      ].filter_map { |segment| segment&.sample }
    end

    def self.search_github(line, repo_nwo)
      query = "\"#{sanitize_query(line)}\" -repo:#{repo_nwo}"
      query = query[0...MAX_QUERY_LENGTH]

      results = GithubService.get("search/code", q: query)
      (results["items"] || []).filter_map { |item| item.dig("repository", "full_name") }.uniq
    rescue GithubService::Error
      []
    end

    def self.sanitize_query(line)
      line.gsub('"', "").strip[0..200]
    end

    def self.meaningful_line?(line)
      return false if line.length < MIN_LINE_LENGTH
      return false if line.start_with?("//", "#", "/*", "*", "--", ";")
      return false if line.match?(/\A[\s{}()\[\];,]+\z/)
      true
    end

    def self.skip(message)
      ShipCheckService::CheckResult.new(
        key: "code_plagiarism", label: DEFINITION[:label],
        status: :skipped, message: message, visibility: :internal
      )
    end
  end
end
