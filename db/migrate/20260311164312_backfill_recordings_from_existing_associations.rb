class BackfillRecordingsFromExistingAssociations < ActiveRecord::Migration[8.1]
  def up
    execute <<~SQL
      INSERT INTO recordings (recordable_type, recordable_id, journal_entry_id, user_id, created_at, updated_at)
      SELECT 'LapseTimelapse', id, journal_entry_id, user_id, created_at, updated_at
      FROM lapse_timelapses
      WHERE journal_entry_id IS NOT NULL
    SQL

    execute <<~SQL
      INSERT INTO recordings (recordable_type, recordable_id, journal_entry_id, user_id, created_at, updated_at)
      SELECT 'YouTubeVideo', ytv.id, ytv.journal_entry_id,
             COALESCE(ytv.user_id, je.user_id),
             ytv.created_at, ytv.updated_at
      FROM you_tube_videos ytv
      JOIN journal_entries je ON je.id = ytv.journal_entry_id
      WHERE ytv.journal_entry_id IS NOT NULL
    SQL
  end

  def down
    execute <<~SQL
      UPDATE lapse_timelapses SET journal_entry_id = r.journal_entry_id
      FROM recordings r
      WHERE r.recordable_type = 'LapseTimelapse' AND r.recordable_id = lapse_timelapses.id
    SQL

    execute <<~SQL
      UPDATE you_tube_videos SET journal_entry_id = r.journal_entry_id, user_id = r.user_id
      FROM recordings r
      WHERE r.recordable_type = 'YouTubeVideo' AND r.recordable_id = you_tube_videos.id
    SQL

    execute "DELETE FROM recordings"
  end
end
