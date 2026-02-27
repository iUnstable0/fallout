require "faraday"
require "json"

module HackatimeService
  class Error < StandardError; end

  module_function

  def host
    "https://hackatime.hackclub.com"
  end

  def me(access_token)
    raise ArgumentError, "access_token is required" if access_token.blank?

    response = connection.get("/api/v1/authenticated/me") do |req|
      req.headers["Authorization"] = "Bearer #{access_token}"
      req.headers["Accept"] = "application/json"
    end

    unless response.success?
      ErrorReporter.capture_message("Hackatime /me fetch failed", level: :warning, contexts: {
        hackatime: { status: response.status }
      })
      return nil
    end

    JSON.parse(response.body)
  rescue StandardError => e
    ErrorReporter.capture_exception(e, level: :warning, contexts: { hackatime: { action: "me" } })
    nil
  end

  def connection
    @connection ||= Faraday.new(url: host)
  end
end
