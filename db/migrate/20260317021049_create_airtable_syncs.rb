class CreateAirtableSyncs < ActiveRecord::Migration[8.1]
  def change
    create_table :airtable_syncs do |t|
      t.string :record_identifier, null: false
      t.string :airtable_id
      t.datetime :last_synced_at
      t.string :synced_attributes_hash

      t.timestamps
    end
    add_index :airtable_syncs, :record_identifier, unique: true
  end
end
