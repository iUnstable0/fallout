class AirtableSyncClassJob < ApplicationJob
  queue_as :background

  def perform(classname)
    AirtableSync.sync!(classname)
  rescue => e
    ErrorReporter.capture_exception(e, contexts: { airtable: { class_name: classname } })
    raise e
  end
end
