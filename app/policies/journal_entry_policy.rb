# frozen_string_literal: true

class JournalEntryPolicy < ApplicationPolicy
  def create?
    return false unless user.present?
    return true if record.project&.user == user # Project owner can always create (preserves trial user behavior)
    !user.trial? && record.project&.collaborator?(user) # Collaborators must be verified
  end

  def show?
    admin? || owner? || record.project&.owner_or_collaborator?(user)
  end

  def update?
    return true if admin?
    owner? && record.project&.owner_or_collaborator?(user) # Author must still be a project participant to edit
  end

  def destroy?
    return true if admin?
    owner? && record.project&.owner_or_collaborator?(user) # Author must still be a project participant to delete
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user&.admin?
        scope.all
      else
        collaborated_project_ids = Collaborator.where(user: user, collaboratable_type: "Project").select(:collaboratable_id)
        scope.kept.where(user: user)
          .or(scope.kept.where(project_id: collaborated_project_ids)) # Entries on projects user collaborates on
      end
    end
  end
end
