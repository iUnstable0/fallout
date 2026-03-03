class HomeController < ApplicationController
  skip_after_action :verify_authorized, only: %i[index] # No authorizable resource
  skip_after_action :verify_policy_scoped, only: %i[index] # No scoped collection

  def index
    render inertia: {
      user: {
        display_name: current_user.display_name,
        email: current_user.email
      }
    }
  end
end
