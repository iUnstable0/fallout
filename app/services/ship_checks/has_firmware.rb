# frozen_string_literal: true

module ShipChecks
  module HasFirmware
    DEFINITION = { key: :has_firmware, label: "Firmware source in repository", deps: [ :repo_tree ], visibility: :user }.freeze

    def self.call(ctx)
      tree = ctx.repo_tree
      if tree.nil?
        msg = ctx.non_github_repo? ? "Skipped (non-GitHub repository)" : "Repository not accessible"
        return ShipCheckService::CheckResult.new(
          key: "has_firmware", label: DEFINITION[:label],
          status: :skipped, message: msg, visibility: :user
        )
      end

      found = tree.any? { |p| p.match?(/\.(ino|py|cpp|h|c|rs|uf2|v)$/i) }
      ShipCheckService::CheckResult.new(
        key: "has_firmware",
        label: DEFINITION[:label],
        status: found ? :passed : :warn,
        message: found ? nil : "Add firmware source code and files if your project has firmware",
        visibility: :user
      )
    end
  end
end
