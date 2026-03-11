# == Schema Information
#
# Table name: you_tube_videos
#
#  id                     :bigint           not null, primary key
#  caption                :boolean
#  channel_title          :string
#  definition             :string
#  description            :text
#  duration_seconds       :integer
#  last_refreshed_at      :datetime
#  live_broadcast_content :string
#  published_at           :datetime
#  tags                   :text
#  thumbnail_url          :string
#  title                  :string
#  was_live               :boolean          default(FALSE)
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  category_id            :string
#  channel_id             :string
#  video_id               :string           not null
#
# Indexes
#
#  index_you_tube_videos_on_video_id  (video_id) UNIQUE
#
require "test_helper"

class YouTubeVideoTest < ActiveSupport::TestCase
  # test "the truth" do
  #   assert true
  # end
end
