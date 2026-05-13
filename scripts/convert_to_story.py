#!/usr/bin/env python3
"""
Convert the linear scenario data (sprechfunk_scenarios_app.json)
into interactive story-node format for FFFunk.

For each scenario, create nodes for each user action point.
Simple translation: each user turn becomes a radio-call button in a node.
"""

import json

# Load curated linear scenarios
with open('/root/.openclaw/workspace/fffunk/src/data/scenarios.json', 'r') as f:
    scenarios = json.load(f)

def linear_to_story(scenario):
    """Convert a linear scenario into story nodes with radio actions"""
    nodes = {}
    node_id_counter = 0

    # First node: initial narrative from first dispatch message
    first_msg = scenario['dialogue'][0]
    start_id = f"node_{node_id_counter:03d}"
    nodes[start_id] = {
        "id": start_id,
        "role": "gruppenführer_a",  # default, override per scenario later
        "narrativeMarkdown": f"**Einsatzleitstelle:** {first_msg['text']}",
        "actions": []
    }
    node_id_counter += 1

    # Walk through dialogue, create a node for each player turn
    i = 1  # skip first dispatch
    while i < len(scenario['dialogue']):
        msg = scenario['dialogue'][i]
        if msg['isUserTurn']:
            # This is a user radio call
            node_id = f"node_{node_id_counter:03d}"
            # Build narrative: dispatch says something first? collect preceding dispatch lines
            pre_dispatch = []
            j = i - 1
            while j >= 0 and not scenario['dialogue'][j]['isUserTurn']:
                pre_dispatch.insert(0, scenario['dialogue'][j])
                j -= 1

            narrative = ""
            if pre_dispatch:
                narrative = "**Einsatzleitstelle:** " + pre_dispatch[0]['text'] + "\n\nWas ist Ihre Antwort?"

            # Expected phrases (canonical)
            expected = msg['expectedPhrases']

            # Success node = next turn is a dispatch (or end)
            success_next = f"node_{node_id_counter+1:03d}"
            # Failure node loops back to same node with feedback
            failure_id = f"node_{node_id_counter:03d}_feedback"

            nodes[node_id] = {
                "id": node_id,
                "role": "gruppenführer_a",
                "narrativeMarkdown": narrative or "Sprechen Sie Ihre Funk-Meldung:",
                "actions": [
                    {
                        "id": "radio_call",
                        "label": "📞 Funk-Meldung sprechen",
                        "radioCall": {
                            "expectedPhrases": expected,
                            "hint": expected[0] if expected else "Sprechen Sie die erwartete Meldung",
                            "onSuccess": success_next,
                            "onFailure": failure_id,
                            "allowPartial": True
                        }
                    }
                ]
            }

            # Create the failure feedback node
            nodes[failure_id] = {
                "id": failure_id,
                "role": "gruppenführer_a",
                "narrativeMarkdown": f"""__FEEDBACK__
**Nicht ganz richtig.**

Erwartet wurde z.B.: "{expected[0] if expected else '?'}"

Tipp: Beachten Sie die genaue Wortwahl und Reihenfolge.
                    """,
                "actions": [
                    {
                        "id": "retry",
                        "label": "Erneut versuchen",
                        "nextNodeId": node_id
                    }
                ]
            }

            node_id_counter += 1
            i += 1
        else:
            i += 1

    # End node
    end_id = f"node_{node_id_counter:03d}"
    nodes[end_id] = {
        "id": end_id,
        "role": "gruppenführer_a",
        "narrativeMarkdown": "**Einsatzleitstelle:** Übung beendet. Gut gemacht!",
        "actions": [
            {
                "id": "restart",
                "label": "Noch einmal trainieren",
                "nextNodeId": start_id
            },
            {
                "id": "exit",
                "label": "Zurück zur Übersicht",
                "nextNodeId": "__exit__"  # handled by engine as special
            }
        ]
    }

    return {
        "id": scenario['id'],
        "title": scenario['title'],
        "description": scenario['description'],
        "startingNodeId": start_id,
        "playerRole": "gruppenführer_a",
        "nodes": nodes
    }

# Build all
story_scenarios = []
for s in scenarios:
    story = linear_to_story(s)
    story_scenarios.append(story)

# Save
with open('/root/.openclaw/workspace/fffunk/src/data/story_scenarios.json', 'w') as f:
    json.dump(story_scenarios, f, indent=2, ensure_ascii=False)

print(f"Converted {len(story_scenarios)} scenarios to story format.")
print("Scenario IDs:", [s['id'] for s in story_scenarios])
# Print stats
total_nodes = sum(len(s['nodes']) for s in story_scenarios)
radio_nodes = sum(
    len([a for node in s['nodes'].values() for a in node['actions'] if 'radioCall' in a])
    for s in story_scenarios
)
print(f"Total nodes: {total_nodes}, Radio calls: {radio_nodes}")
