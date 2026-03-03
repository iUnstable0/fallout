class Admin::StaticPagesController < Admin::ApplicationController
  skip_authorization only: %i[index] # No authorizable resource; staff access enforced by Admin::ApplicationController
  skip_policy_scope only: %i[index] # No scoped collection

  def index; end
end
