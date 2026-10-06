Feature: Dashboard greeting and summary stats
  As a signed-in parent,
  I want to see a time-of-day greeting with my first name and four summary counts on the Dashboard,
  So that I can tell whose account I’m in and get a quick snapshot of kids, circle, playdates, and birthdays this month.

# Happy paths

  Scenario: Greeting shows first name with bang and wave on Dashboard
    Given I am signed in as Family A and open "/app"
    When the Dashboard loads
    Then I see an h2 greeting that includes my first name and ends with "!" and "👋" (e.g. "Good afternoon, Yaroslav! 👋")
    And I see the banner title "Dashboard"

  Scenario: Greeting is Good morning before noon
    Given I am signed in on "/app" with local time before 12:00
    When I view the greeting
    Then it starts with "Good morning"

  Scenario: Greeting is Good afternoon from noon through 17:59
    Given I am signed in on "/app" with local time from 12:00 through 17:59
    When I view the greeting
    Then it starts with "Good afternoon"

  Scenario: Greeting is Good evening from 18:00 through 23:59
    Given I am signed in on "/app" with local time from 18:00 through 23:59
    When I view the greeting
    Then it starts with "Good evening"

  Scenario: Setup subtitle when family is not set up
    Given I am signed in as Family A with no family set up
    When I view "/app"
    Then under the greeting I see "Start by setting up your family below."

  Scenario: Empty summary cards show zero
    Given I am signed in on "/app" with no kids, circle, playdates, or birthdays data
    When I view the summary row
    Then I see four cards labeled "My Kids", "Families in Circle", "Playdates", and "Birthdays This Month"
    And each card shows "0"

  Scenario: Family B sees its own greeting name and stats
    Given I am signed in as Family B
    When I open "/app"
    Then the greeting uses Family B’s first name (e.g. "Yaroslav2")
    And shows that account’s own stats (not Family A’s name)

# Negative

  Scenario: Logged-out visit to Dashboard redirects to login
    Given I am logged out
    When I open "/app"
    Then I am taken to "/login"
    And I see "Welcome back"
    And I do not see the Dashboard greeting or summary stats

  Scenario: Summary cards do not navigate away from Dashboard
    Given I am on "/app" viewing the four summary cards
    When I click each card
    Then I remain on "/app" (URL does not change)

  Scenario: Log out leaves Dashboard for login
    Given I am signed in on "/app" in an isolated session
    When I click "Log out"
    Then I am taken to "/login"
    And I see "Welcome back"

# Edge cases

  Scenario: Greeting is Good morning at 00:30
    Given I am signed in on "/app" with local time 00:30
    When I view the greeting
    Then it starts with "Good morning"

  Scenario: Greeting switches at noon boundary
    Given I am signed in on "/app" with local time 11:59
    When I view the greeting
    Then it starts with "Good morning"
    Given I am signed in on "/app" with local time 12:00
    When I view the greeting
    Then it starts with "Good afternoon"

  Scenario: Greeting switches at evening boundary
    Given I am signed in on "/app" with local time 17:59
    When I view the greeting
    Then it starts with "Good afternoon"
    Given I am signed in on "/app" with local time 18:00
    When I view the greeting
    Then it starts with "Good evening"

  Scenario: Greeting is Good evening at 23:59
    Given I am signed in on "/app" with local time 23:59
    When I view the greeting
    Then it starts with "Good evening"

  Scenario: Family B session does not show Family A first name
    Given Family A is signed in in one context and Family B in another
    When each opens "/app"
    Then Family B’s greeting does not include "Yaroslav,"
    And Family A’s greeting does not include "Yaroslav2"

<!--
Ambiguities / gaps:
- What subtitle appears after a family is created (only the setup subtitle was visible; Create was not submitted).
- Non-zero values for My Kids, Families in Circle, Playdates, and Birthdays This Month (both accounts were at 0).
- Exact meaning of each count (e.g. all playdates vs upcoming; whose birthdays; whether "circle" includes pending invites).
- Whether greeting switches to Display name when that Profile field is filled (field was empty; not edited).
- Whether the greeting updates live at a time boundary without reload.
- Loading or error UI if stats fail to load (not observed).
- Whether 00:00–00:29 is morning (only 00:30 was observed on Confluence).
- AQPBT-2 AC do not define invalid Family name inputs; test-data/invalid-family.ts stays empty; family Create is out of scope.
-->
