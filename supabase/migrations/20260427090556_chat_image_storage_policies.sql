-- Storage RLS policies for the chat_image bucket.
-- Path format: {groupChatId}/{uuid}.{ext}
-- Access is granted to trip participants who are members of the group chat.

CREATE POLICY "chat participants can upload chat images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat_image'
  AND EXISTS (
    SELECT 1 FROM chat_participant cp
    JOIN trip_participant tp ON tp.id = cp.participant_id
    WHERE cp.group_chat_id = (storage.foldername(name))[1]::uuid
      AND tp.user_id = auth.uid()
  )
);

CREATE POLICY "chat participants can read chat images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat_image'
  AND EXISTS (
    SELECT 1 FROM chat_participant cp
    JOIN trip_participant tp ON tp.id = cp.participant_id
    WHERE cp.group_chat_id = (storage.foldername(name))[1]::uuid
      AND tp.user_id = auth.uid()
  )
);

CREATE POLICY "chat participants can delete chat images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat_image'
  AND EXISTS (
    SELECT 1 FROM chat_participant cp
    JOIN trip_participant tp ON tp.id = cp.participant_id
    WHERE cp.group_chat_id = (storage.foldername(name))[1]::uuid
      AND tp.user_id = auth.uid()
  )
);
