class RemoveJournalEntryFromLapseTimelapsesAndYouTubeVideos < ActiveRecord::Migration[8.1]
  def change
    remove_reference :lapse_timelapses, :journal_entry, foreign_key: true
    remove_reference :you_tube_videos, :journal_entry, foreign_key: true
    remove_reference :you_tube_videos, :user, foreign_key: true
  end
end
