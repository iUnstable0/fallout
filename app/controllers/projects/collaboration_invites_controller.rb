class Projects::CollaborationInvitesController < ApplicationController
  # No index action — blanket skip required (Rails 8.1 callback validation)
  skip_after_action :verify_authorized
  skip_after_action :verify_policy_scoped

  before_action :require_collaborators_feature! # Gated behind :collaborators feature flag
  before_action :set_project

  def create
    authorize @project, :manage_collaborators? # Only project owner can send invites

    # Always respond with the same success message to prevent email enumeration.
    # Invalid emails, already-invited users, and duplicate invites all appear identical to the caller.
    invitee = User.verified.kept.find_by(email: params[:email]&.strip&.downcase)

    if invitee
      invite = @project.collaboration_invites.build(inviter: current_user, invitee: invitee)
      if invite.save
        MailDeliveryService.collaboration_invite_sent(invite)
      end
    end

    redirect_back fallback_location: project_path(@project), notice: "Invite sent!"
  end

  def destroy
    invite = @project.collaboration_invites.find(params[:id])
    authorize invite, :revoke? # Only inviter/admin can revoke a pending invite
    invite.revoked!
    redirect_back fallback_location: project_path(@project), notice: "Invite revoked."
  end

  private

  def set_project
    @project = Project.kept.find(params[:project_id])
  end

  def require_collaborators_feature!
    return if collaborators_enabled?
    redirect_back fallback_location: root_path, alert: "This feature is not available."
  end
end
