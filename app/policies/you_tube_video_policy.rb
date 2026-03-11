# frozen_string_literal: true

class YouTubeVideoPolicy < ApplicationPolicy
  def lookup?
    user.present?
  end
end
