require "faraday"
require "json"

module YouTubeService
  class Error < StandardError; end

  VIDEO_ID_REGEX = %r{(?:youtube\.com/(?:watch\?.*v=|embed/|live/)|youtu\.be/)([a-zA-Z0-9_-]{11})}
  CACHE_TTL = 30.days
  THUMBNAIL_QUALITIES = %w[default mqdefault hqdefault sddefault maxresdefault].freeze

  module_function

  def video_info(url)
    video_id = extract_video_id(url)
    return nil if video_id.blank?

    Rails.cache.fetch("youtube_video/#{video_id}", expires_in: CACHE_TTL) do
      fetch_video_data(video_id)
    end
  end

  def thumbnail_url(url, quality: "default")
    video_id = extract_video_id(url)
    return nil if video_id.blank?

    quality_key = THUMBNAIL_QUALITIES.include?(quality) ? quality : "default"
    "https://i.ytimg.com/vi/#{video_id}/#{quality_key}.jpg"
  end

  def extract_video_id(url)
    return nil if url.blank?
    url.to_s.match(VIDEO_ID_REGEX)&.[](1)
  end

  def fetch_video_data(video_id)
    response = connection.get("/youtube/v3/videos") do |req|
      req.headers["Accept"] = "application/json"
      req.params["part"] = "snippet,contentDetails"
      req.params["id"] = video_id
      req.params["key"] = ENV.fetch("YOUTUBE_API_KEY", nil)
    end

    unless response.success?
      ErrorReporter.capture_message("YouTube video fetch failed", level: :warning, contexts: {
        youtube: { status: response.status, video_id: video_id }
      })
      return nil
    end

    data = JSON.parse(response.body)
    item = data.dig("items", 0)
    return nil if item.nil?

    {
      video_id: video_id,
      title: item.dig("snippet", "title"),
      thumbnail_url: thumbnail_url_from_id(video_id),
      duration_seconds: parse_iso8601_duration(item.dig("contentDetails", "duration"))
    }
  rescue StandardError => e
    ErrorReporter.capture_exception(e, level: :warning, contexts: { youtube: { action: "fetch_video_data", video_id: video_id } })
    nil
  end

  def thumbnail_url_from_id(video_id, quality: "default")
    quality_key = THUMBNAIL_QUALITIES.include?(quality) ? quality : "default"
    "https://i.ytimg.com/vi/#{video_id}/#{quality_key}.jpg"
  end

  def parse_iso8601_duration(duration_string)
    return nil if duration_string.blank?
    match = duration_string.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    return nil unless match
    (match[1].to_i * 3600) + (match[2].to_i * 60) + match[3].to_i
  end

  def connection
    @connection ||= Faraday.new(url: "https://www.googleapis.com")
  end
end
