class AddLastRefreshedAtToYouTubeVideos < ActiveRecord::Migration[8.1]
  def change
    add_column :you_tube_videos, :last_refreshed_at, :datetime
  end
end
