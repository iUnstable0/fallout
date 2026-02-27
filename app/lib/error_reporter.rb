module ErrorReporter
  module_function

  def capture_exception(exception, **opts)
    level = opts.delete(:level) || :error
    Rails.logger.tagged("ErrorReporter") do
      Rails.logger.public_send(logger_level(level), "#{exception.class}: #{exception.message}")
    end
    Sentry.capture_exception(exception, level: level, **opts)
  end

  def capture_message(message, **opts)
    level = opts.delete(:level) || :error
    context_info = opts[:contexts]&.values&.first
    log_line = context_info ? "#{message} #{context_info.to_json}" : message
    Rails.logger.tagged("ErrorReporter") do
      Rails.logger.public_send(logger_level(level), log_line)
    end
    Sentry.capture_message(message, level: level, **opts)
  end

  def logger_level(sentry_level)
    case sentry_level.to_sym
    when :fatal then :fatal
    when :error then :error
    when :warning then :warn
    when :info then :info
    else :error
    end
  end
end
