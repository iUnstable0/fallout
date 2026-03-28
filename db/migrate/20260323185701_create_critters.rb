class CreateCritters < ActiveRecord::Migration[8.1]
  def change
    create_table :critters do |t|
      t.references :user, null: false, foreign_key: true
      t.references :journal_entry, null: false, foreign_key: true
      t.string :variant, null: false
      t.boolean :spun, null: false, default: false

      t.timestamps
    end

    add_index :critters, [ :user_id, :created_at ] # Rolling 12h window eligibility query
  end
end
