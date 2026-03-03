class HomeController < ApplicationController
  skip_authorization only: %i[index] # No authorizable resource
  skip_policy_scope only: %i[index] # No scoped collection

  def index
    render inertia: {
      user: {
        display_name: current_user.display_name,
        email: current_user.email
      }
    }
  end
end
