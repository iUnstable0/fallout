class CreateRecordings < ActiveRecord::Migration[8.1]
  def change
    create_table :recordings do |t|
      t.string :recordable_type, null: false
      t.bigint :recordable_id, null: false
      t.references :journal_entry, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end

    add_index :recordings, [ :recordable_type, :recordable_id ], unique: true
    add_column :you_tube_videos, :was_live, :boolean, default: false
  end
end
