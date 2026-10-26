#!/bin/bash
set -e

PSQL="docker exec -e PGPASSWORD=root postgres psql -U moodleuser -d moodledb"

echo "=== 1. Checking Moodle user ==="
$PSQL -c "SELECT id, username, email, auth, suspended, deleted FROM mdl_user WHERE username = 'nathan1' OR email = 'natumpal2004@gmail.com';"

echo "=== 2. Current Site Admins ==="
$PSQL -c "SELECT name, value FROM mdl_config WHERE name = 'siteadmins';"

# Check if nathan1 exists
USER_EXISTS=$($PSQL -t -A -c "SELECT count(*) FROM mdl_user WHERE username = 'nathan1';")

if [ "$USER_EXISTS" -eq 0 ]; then
  echo "Creating user nathan1 in mdl_user..."
  NOW=$(date +%s)
  $PSQL -c "
    INSERT INTO mdl_user (
      auth, confirmed, policyagreed, deleted, suspended, mnethostid,
      username, password, firstname, lastname, email,
      timecreated, timemodified
    ) VALUES (
      'oidc', 1, 1, 0, 0, 1,
      'nathan1', 'not cached', 'Nathan', 'Co-Dev', 'natumpal2004@gmail.com',
      $NOW, $NOW
    );
  "
fi

NATHAN_ID=$($PSQL -t -A -c "SELECT id FROM mdl_user WHERE username = 'nathan1';")
echo "nathan1 Moodle user ID: $NATHAN_ID"

# Add to siteadmins if not already present
CURRENT_ADMINS=$($PSQL -t -A -c "SELECT value FROM mdl_config WHERE name = 'siteadmins';")
echo "Current siteadmins: $CURRENT_ADMINS"

if [[ ",$CURRENT_ADMINS," != *",$NATHAN_ID,"* ]]; then
  NEW_ADMINS="${CURRENT_ADMINS},${NATHAN_ID}"
  echo "Updating siteadmins to: $NEW_ADMINS"
  $PSQL -c "UPDATE mdl_config SET value = '$NEW_ADMINS' WHERE name = 'siteadmins';"
else
  echo "User $NATHAN_ID already in siteadmins."
fi

echo "=== 3. Purging Moodle Cache ==="
docker exec -u daemon moodle php /bitnami/moodle/admin/cli/purge_caches.php

echo "=== 4. Verified Site Admins ==="
$PSQL -c "SELECT name, value FROM mdl_config WHERE name = 'siteadmins';"
