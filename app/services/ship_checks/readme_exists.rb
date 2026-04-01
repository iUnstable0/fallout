# frozen_string_literal: true

module ShipChecks
  module ReadmeExists
    DEFINITION = { key: :readme_exists, label: "README exists in repository", deps: [ :repo_tree ], visibility: :user }.freeze

    def self.call(ctx)
      tree = ctx.repo_tree
      if tree.nil?
        msg = ctx.non_github_repo? ? "Skipped (non-GitHub repository)" : "Repository not accessible"
        return ShipCheckService::CheckResult.new(
          key: "readme_exists", label: DEFINITION[:label],
          status: :skipped, message: msg, visibility: :user
        )
      end

      found = tree.any? { |path| File.basename(path).match?(/\Areadme(\.\w+)?\z/i) }
      ShipCheckService::CheckResult.new(
        key: "readme_exists",
        label: DEFINITION[:label],
        status: found ? :passed : :warn,
        message: found ? nil : "Add a README to your repository",
        visibility: :user
      )
    end
  end
end
