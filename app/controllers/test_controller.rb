class TestController < ApplicationController
  allow_unauthenticated_access only: %i[index] # Public test page
  allow_trial_access only: %i[index] # Trial users can view test page
  skip_after_action :verify_authorized, only: %i[index] # No authorizable resource
  skip_after_action :verify_policy_scoped, only: %i[index] # No scoped collection

  def index
    render inertia: "test/index"
  end
end
