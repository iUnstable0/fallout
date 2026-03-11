class YouTubeVideosController < ApplicationController
  allow_trial_access only: %i[lookup] # Trial users can look up videos during journal creation
  skip_after_action :verify_authorized # No index action — blanket skip required (Rails 8.1 callback validation)
  skip_after_action :verify_policy_scoped # No index action — blanket skip required (Rails 8.1 callback validation)

  def lookup
    authorize :you_tube_video, :lookup?

    url = params[:url].to_s

    if url.match?(YouTubeService::SHORTS_REGEX)
      return render json: { error: "YouTube Shorts are not accepted. Please use a regular video or live stream." },
                    status: :unprocessable_entity
    end

    video = YouTubeService.find_or_fetch(url)

    if video
      claimed = Recording.exists?(recordable: video)
      render json: {
        id: video.id,
        video_id: video.video_id,
        title: video.title,
        thumbnail_url: video.thumbnail_url,
        duration_seconds: video.duration_seconds,
        was_live: video.was_live,
        claimed: claimed
      }
    else
      render json: { error: "Could not find video. Check the URL and try again." }, status: :unprocessable_entity
    end
  end
end
