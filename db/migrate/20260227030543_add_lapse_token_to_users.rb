class AddLapseTokenToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :lapse_token, :text
  end
end
