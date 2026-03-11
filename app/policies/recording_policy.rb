# frozen_string_literal: true

class RecordingPolicy < ApplicationPolicy
  def create?
    user.present?
  end
end
