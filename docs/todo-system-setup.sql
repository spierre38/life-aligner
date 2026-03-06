CREATE OR REPLACE FUNCTION get_all_todos(p_user_id UUID)
RETURNS TABLE (
  id TEXT,
  text TEXT,
  description TEXT,
  status TEXT,
  priority TEXT,
  due_date DATE,
  category TEXT,
  source TEXT,  -- 'roadmap' or 'manual'
  goal_title TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    activity->>'id' as id,
    activity->>'text' as text,
    activity->>'notes' as description,
    activity->>'status' as status,
    activity->>'priority' as priority,
    (activity->>'due_date')::DATE as due_date,
    item->>'category' as category,
    'roadmap'::TEXT as source,
    COALESCE(item->>'goal', item->>'behavior_change') as goal_title
  FROM workbook_entries,
       jsonb_array_elements(content->'items') as item,
       jsonb_array_elements(item->'activities') as activity
  WHERE user_id = p_user_id
    AND category = 'roadmap'
  
  UNION ALL
  
  SELECT 
    todo->>'id' as id,
    todo->>'text' as text,
    todo->>'description' as description,
    todo->>'status' as status,
    todo->>'priority' as priority,
    (todo->>'due_date')::DATE as due_date,
    todo->>'category' as category,
    'manual'::TEXT as source,
    NULL as goal_title
  FROM workbook_entries,
       jsonb_array_elements(content->'manual_todos') as todo
  WHERE user_id = p_user_id
    AND category = 'roadmap'
  
  ORDER BY due_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_all_todos(UUID) TO authenticated;


-- Update activity status
CREATE OR REPLACE FUNCTION update_activity_status(
  p_user_id UUID,
  p_activity_id TEXT,
  p_status TEXT
)
RETURNS void AS $$
DECLARE
  v_content JSONB;
BEGIN
  -- Get current content
  SELECT content INTO v_content
  FROM workbook_entries
  WHERE user_id = p_user_id AND category = 'roadmap';
  
  -- Update the specific activity status
  v_content := jsonb_set(
    v_content,
    array['items'],
    (
      SELECT jsonb_agg(
        CASE 
          WHEN item @> jsonb_build_object('activities', 
            jsonb_build_array(
              jsonb_build_object('id', p_activity_id)
            )
          )
          THEN jsonb_set(
            item,
            '{activities}',
            (
              SELECT jsonb_agg(
                CASE 
                  WHEN activity->>'id' = p_activity_id
                  THEN jsonb_set(
                    jsonb_set(
                      activity,
                      '{status}',
                      to_jsonb(p_status)
                    ),
                    '{completed_at}',
                    CASE WHEN p_status = 'completed' 
                      THEN to_jsonb(NOW()::TEXT) 
                      ELSE 'null'::jsonb 
                    END
                  )
                  ELSE activity
                END
              )
              FROM jsonb_array_elements(item->'activities') as activity
            )
          )
          ELSE item
        END
      )
      FROM jsonb_array_elements(v_content->'items') as item
    )
  );
  
  -- Update the workbook entry
  UPDATE workbook_entries
  SET content = v_content,
      updated_at = NOW()
  WHERE user_id = p_user_id AND category = 'roadmap';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_activity_status(UUID, TEXT, TEXT) TO authenticated;
