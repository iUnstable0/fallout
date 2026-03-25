# frozen_string_literal: true

class ProjectPolicy < ApplicationPolicy
  def index?
    true
  end

  def onboarding?
    true # Any authenticated user can view the project onboarding modal
  end

  def show?
    return false if record.discarded? && !admin?
    admin? || !record.is_unlisted || owner? || record.collaborator?(user) # Collaborators can see unlisted projects they're on
  end

  def create?
    return false unless user.present?
    return user.projects.count < 1 if user.trial?

    true
  end

  def update?
    return false if record.discarded? && !admin?
    admin? || owner?
  end

  def destroy?
    return false if record.discarded?
    admin? || owner?
  end

  def manage_collaborators?
    return false unless user.present? && !user.trial?
    admin? || owner? # Only verified project owners can send/revoke invites
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user&.admin?
        scope.all
      else
        collaborated_ids = Collaborator.where(user: user, collaboratable_type: "Project").select(:collaboratable_id)
        scope.kept.listed
          .or(scope.kept.where(user: user))
          .or(scope.kept.where(id: collaborated_ids)) # Include projects user collaborates on
      end
    end
  end
end
