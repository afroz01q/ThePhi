-- 1. Function and trigger for exchange requests notifications
CREATE OR REPLACE FUNCTION public.notify_exchange_request()
RETURNS TRIGGER AS $$
DECLARE
  v_sender_name TEXT;
  v_receiver_name TEXT;
  v_teach_skill TEXT;
  v_learn_skill TEXT;
BEGIN
  SELECT COALESCE(full_name, username, 'A peer') INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;
  SELECT COALESCE(full_name, username, 'A peer') INTO v_receiver_name FROM public.profiles WHERE id = NEW.receiver_id;
  SELECT name INTO v_teach_skill FROM public.skills WHERE id = NEW.teach_skill_id;
  SELECT name INTO v_learn_skill FROM public.skills WHERE id = NEW.learn_skill_id;

  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.notifications (user_id, actor_id, type, title, content, link, is_read, created_at)
    VALUES (
      NEW.receiver_id,
      NEW.sender_id,
      'exchange_request',
      'New Skill Exchange Proposal',
      v_sender_name || ' proposed an exchange: teaching ' || COALESCE(v_teach_skill, 'a skill') || ' for ' || COALESCE(v_learn_skill, 'your skill') || '.',
      '/exchanges?tab=incoming',
      false,
      NOW()
    );
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO public.notifications (user_id, actor_id, type, title, content, link, is_read, created_at)
      VALUES (
        NEW.sender_id,
        NEW.receiver_id,
        'request_accepted',
        'Exchange Proposal Accepted!',
        v_receiver_name || ' accepted your skill exchange proposal! You can now schedule learning sessions.',
        '/exchanges?tab=active',
        false,
        NOW()
      );
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, actor_id, type, title, content, link, is_read, created_at)
      VALUES (
        NEW.sender_id,
        NEW.receiver_id,
        'request_declined',
        'Exchange Proposal Declined',
        v_receiver_name || ' declined your skill exchange proposal.',
        '/exchanges?tab=history',
        false,
        NOW()
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_exchange_request ON public.exchange_requests;
CREATE TRIGGER trg_notify_exchange_request
AFTER INSERT OR UPDATE OF status ON public.exchange_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_exchange_request();

-- 2. Function and trigger for direct messages notifications
CREATE OR REPLACE FUNCTION public.notify_message()
RETURNS TRIGGER AS $$
DECLARE
  v_recipient_id UUID;
  v_sender_name TEXT;
  v_preview TEXT;
BEGIN
  -- Determine recipient from conversation
  SELECT 
    CASE WHEN user1_id = NEW.sender_id THEN user2_id ELSE user1_id END
  INTO v_recipient_id
  FROM public.conversations
  WHERE id = NEW.conversation_id;

  IF v_recipient_id IS NOT NULL AND v_recipient_id != NEW.sender_id THEN
    SELECT COALESCE(full_name, username, 'A peer') INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;
    v_preview := substring(NEW.content from 1 for 60);

    INSERT INTO public.notifications (user_id, actor_id, type, title, content, link, is_read, created_at)
    VALUES (
      v_recipient_id,
      NEW.sender_id,
      'message',
      'New message from ' || v_sender_name,
      v_preview,
      '/chat',
      false,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_message ON public.messages;
CREATE TRIGGER trg_notify_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_message();

-- 3. Function and trigger for session scheduling notifications
CREATE OR REPLACE FUNCTION public.notify_session()
RETURNS TRIGGER AS $$
DECLARE
  v_creator_name TEXT;
  v_target_user_id UUID;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Notify learner if teacher created, or teacher if learner created
    INSERT INTO public.notifications (user_id, actor_id, type, title, content, link, is_read, created_at)
    VALUES (
      NEW.learner_id,
      NEW.teacher_id,
      'session_scheduled',
      'Session Scheduled: ' || NEW.title,
      'A ' || COALESCE(NEW.format, 'Online') || ' session is scheduled for ' || NEW.session_date || ' at ' || NEW.start_time || '.',
      '/sessions',
      false,
      NOW()
    );
    INSERT INTO public.notifications (user_id, actor_id, type, title, content, link, is_read, created_at)
    VALUES (
      NEW.teacher_id,
      NEW.learner_id,
      'session_scheduled',
      'Session Scheduled: ' || NEW.title,
      'A ' || COALESCE(NEW.format, 'Online') || ' session is scheduled for ' || NEW.session_date || ' at ' || NEW.start_time || '.',
      '/sessions',
      false,
      NOW()
    );
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    IF NEW.status = 'cancelled' THEN
      INSERT INTO public.notifications (user_id, type, title, content, link, is_read, created_at)
      VALUES 
        (NEW.teacher_id, 'session_cancelled', 'Session Cancelled', 'The session "' || NEW.title || '" was cancelled.', '/sessions', false, NOW()),
        (NEW.learner_id, 'session_cancelled', 'Session Cancelled', 'The session "' || NEW.title || '" was cancelled.', '/sessions', false, NOW());
    ELSIF NEW.status = 'completed' THEN
      INSERT INTO public.notifications (user_id, type, title, content, link, is_read, created_at)
      VALUES 
        (NEW.teacher_id, 'session_completed', 'Session Completed', 'The session "' || NEW.title || '" was marked as completed. Please leave a review!', '/sessions', false, NOW()),
        (NEW.learner_id, 'session_completed', 'Session Completed', 'The session "' || NEW.title || '" was marked as completed. Please leave a review!', '/sessions', false, NOW());
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_session ON public.sessions;
CREATE TRIGGER trg_notify_session
AFTER INSERT OR UPDATE OF status ON public.sessions
FOR EACH ROW EXECUTE FUNCTION public.notify_session();
