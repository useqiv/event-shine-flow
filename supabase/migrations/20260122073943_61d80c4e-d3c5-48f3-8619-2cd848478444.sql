-- Fix the update_vote_streak function to handle guest votes (where user_id is NULL)
CREATE OR REPLACE FUNCTION public.update_vote_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_last_vote_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_bonus_amount NUMERIC := 0;
BEGIN
  -- Skip streak tracking for guest votes (user_id is NULL)
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get or create streak record
  SELECT last_vote_date, current_streak, longest_streak
  INTO v_last_vote_date, v_current_streak, v_longest_streak
  FROM public.user_vote_streaks
  WHERE user_id = NEW.user_id;
  
  IF NOT FOUND THEN
    -- Create new streak record
    INSERT INTO public.user_vote_streaks (user_id, current_streak, longest_streak, last_vote_date)
    VALUES (NEW.user_id, 1, 1, CURRENT_DATE);
  ELSE
    -- Check if voting on a new day
    IF v_last_vote_date IS NULL OR v_last_vote_date < CURRENT_DATE THEN
      IF v_last_vote_date = CURRENT_DATE - INTERVAL '1 day' THEN
        -- Consecutive day - increase streak
        v_current_streak := v_current_streak + 1;
        
        -- Award bonus at streak milestones (every 7 days)
        IF v_current_streak % 7 = 0 THEN
          v_bonus_amount := 50 * (v_current_streak / 7); -- 50 Naira per week streak
          
          -- Add bonus to wallet
          UPDATE public.wallets
          SET balance = balance + v_bonus_amount
          WHERE user_id = NEW.user_id;
          
          -- Create notification for streak bonus
          INSERT INTO public.notifications (user_id, title, message, type)
          VALUES (
            NEW.user_id,
            'Streak Bonus!',
            'Congratulations! You earned ₦' || v_bonus_amount::TEXT || ' for your ' || v_current_streak || '-day voting streak!',
            'streak'
          );
        END IF;
      ELSIF v_last_vote_date < CURRENT_DATE - INTERVAL '1 day' THEN
        -- Streak broken - reset to 1
        v_current_streak := 1;
      END IF;
      
      -- Update longest streak if current is higher
      IF v_current_streak > v_longest_streak THEN
        v_longest_streak := v_current_streak;
      END IF;
      
      -- Update streak record
      UPDATE public.user_vote_streaks
      SET 
        current_streak = v_current_streak,
        longest_streak = v_longest_streak,
        last_vote_date = CURRENT_DATE,
        total_streak_bonuses_earned = total_streak_bonuses_earned + v_bonus_amount,
        updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;