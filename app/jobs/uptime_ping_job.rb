class UptimePingJob < ApplicationJob
  queue_as :uptime

  def perform
    url = ENV["UPTIME_WORKER_PING_URL"]
    unless url.present?
      Rails.logger.warn "UPTIME_WORKER_PING_URL not set, skipping uptime ping"
      return
    end

    begin
      response = Faraday.get(url)

      unless response.success?
        ErrorReporter.capture_message("Uptime ping failed", level: :warning, contexts: {
          uptime: { status: response.status }
        })
      end
    rescue => e
      ErrorReporter.capture_exception(e, contexts: { uptime: { url: url } })
    end
  end
end
