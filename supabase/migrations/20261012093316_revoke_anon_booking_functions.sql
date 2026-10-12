/*
# Revoke anon execute on booking functions

The SECURITY DEFINER functions book_trip and cancel_booking were callable by the
anon role. These functions check auth.uid() internally and would reject
unauthenticated calls, but the lint advisor correctly flags the surface area.
This migration revokes EXECUTE from anon so only authenticated users can call
them through the REST API.

## Changes
- REVOKE EXECUTE on book_trip and cancel_booking from the anon role.
*/

REVOKE ALL ON FUNCTION public.book_trip(uuid, text[], text, text) FROM anon;
REVOKE ALL ON FUNCTION public.cancel_booking(uuid) FROM anon;
