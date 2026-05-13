import { useState, useEffect, useRef } from 'react';
import { Scenario, StoryNode, Action } from '../types/story';
import { StoryEngine } from '../lib/story-engine';
import { AudioEngine } from '../lib/audio-engine';
import NarrativePanel from './NarrativePanel';
import { ActionButtons } from './ActionButtons';
import RadioCallModal from './RadioCallModal';

interface Props {
  scenario: Scenario;
  engine: StoryEngine;
  audio: AudioEngine;
  onExit: () => void;
}

export default function PracticeScreen({ scenario, engine, audio, onExit }: Props) {
  const [currentNode, setCurrentNode] = useState<StoryNode>(engine.getCurrentNode());
  const [radioModalOpen, setRadioModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [score, setScore] = useState(engine.getProgress().score);

  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshNode = () => {
    setCurrentNode(engine.getCurrentNode());
    setScore(engine.getProgress().score);
  };

  const handleAction = (action: Action) => {
    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }
    if (action.radioCall) {
      setPendingAction(action);
      setRadioModalOpen(true);
      return;
    }
    if (action.nextNodeId) {
      if (action.nextNodeId === '__exit__') {
        onExit();
        return;
      }
      engine.goTo(action.nextNodeId);
      refreshNode();
    }
  };

  const handleRadioResult = (success: boolean, transcript: string) => {
    setRadioModalOpen(false);
    const action = pendingAction!;
    const nextNodeId = success ? action.radioCall!.onSuccess : action.radioCall!.onFailure;

    if (success) {
      engine.completeNode(10);
      setFeedback({ success: true, message: action.radioCall!.feedbackSuccess || '✅ Gut so! Einsatzleitstelle bestätigt.' });
    } else {
      setFeedback({
        success: false,
        message: action.radioCall!.feedbackFailure || `❌ Nicht ganz richtig. ${action.radioCall!.hint}`,
      });
    }

    navigationTimerRef.current = setTimeout(() => {
      navigationTimerRef.current = null;
      engine.goTo(nextNodeId);
      refreshNode();
      setFeedback(null);
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (navigationTimerRef.current) clearTimeout(navigationTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (currentNode.narrative) {
      audio.speakRadio(currentNode.narrative).catch(() => {});
    }
  }, [currentNode.id, audio]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div>
            <h2 className="text-lg font-bold">{scenario.title}</h2>
            <p className="text-xs text-[#a3a3a3]">{scenario.description}</p>
          </div>
        </div>
        <div className="text-sm font-mono text-[#dc2626]">Punkte: {score}</div>
      </div>

      {/* Narrative */}
      <NarrativePanel narrative={currentNode.narrative} />

      {/* Feedback toast */}
      {feedback && (
        <div className={`p-4 rounded-lg border ${feedback.success ? 'bg-green-900/20 border-green-700 text-green-200' : 'bg-red-900/20 border-red-700 text-red-200'}`}>
          {feedback.message}
        </div>
      )}

      {/* Actions */}
      <ActionButtons actions={currentNode.actions} onSelect={handleAction} />

      {/* Radio Call Modal */}
      {radioModalOpen && pendingAction && (
        <RadioCallModal
          isOpen={true}
          onClose={() => setRadioModalOpen(false)}
          onResult={handleRadioResult}
          expectedPhrases={pendingAction.radioCall!.expectedPhrases}
          hint={pendingAction.radioCall!.hint}
          feedbackFailure={pendingAction.radioCall!.feedbackFailure}
        />
      )}
    </div>
  );
}
