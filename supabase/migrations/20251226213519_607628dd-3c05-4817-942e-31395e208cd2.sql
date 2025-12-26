-- Create user_vote_streaks table for tracking voting streaks
CREATE TABLE public.user_vote_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_vote_date DATE,
  total_streak_bonuses_earned NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_vote_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own streak"
ON public.user_vote_streaks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak"
ON public.user_vote_streaks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak"
ON public.user_vote_streaks FOR UPDATE
USING (auth.uid() = user_id);

-- Create favorite_contestants table
CREATE TABLE public.favorite_contestants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contestant_id UUID NOT NULL REFERENCES public.contestants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, contestant_id)
);

-- Enable RLS
ALTER TABLE public.favorite_contestants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own favorites"
ON public.favorite_contestants FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
ON public.favorite_contestants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON public.favorite_contestants FOR DELETE
USING (auth.uid() = user_id);

-- Function to update vote streak when a user votes
CREATE OR REPLACE FUNCTION public.update_vote_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_last_vote_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
  v_bonus_amount NUMERIC := 0;
BEGIN
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
$$;

-- Create trigger for vote streak
CREATE TRIGGER on_vote_update_streak
  AFTER INSERT ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vote_streak();

-- Add updated_at trigger for user_vote_streaks
CREATE TRIGGER update_user_vote_streaks_updated_at
  BEFORE UPDATE ON public.user_vote_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();