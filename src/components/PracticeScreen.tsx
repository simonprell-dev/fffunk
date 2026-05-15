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
  const [muted, setMuted] = useState(audio.isMuted());

  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshNode = () => {
    setCurrentNode(engine.getCurrentNode());
    setScore(engine.getProgress().score);
  };

  const toggleMute = () => {
    const next = !muted;
    audio.setMuted(next);
    setMuted(next);
  };

  const handleExit = () => {
    audio.stop();
    onExit();
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
        handleExit();
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
      setFeedback({ success: true, message: 'Gut so! Einsatzleitstelle bestätigt.' });
    } else {
      setFeedback({
        success: false,
        message: `Nicht ganz richtig. ${action.radioCall!.hint}`,
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
      audio.stop();
    };
  }, [audio]);

  useEffect(() => {
    if (currentNode.narrative) {
      audio.speakRadio(currentNode.narrative).catch(() => {});
    }
  }, [currentNode.id, audio]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{scenario.title}</h2>
          <p className="text-xs text-[#a3a3a3]">{scenario.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMute}
            title={muted ? 'Ton einschalten' : 'Stummschalten'}
            className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-colors ${
              muted
                ? 'bg-[#dc2626]/20 border-[#dc2626] text-[#dc2626]'
                : 'bg-[#262626] border-[#444] text-[#a3a3a3] hover:text-white'
            }`}
          >
            {muted ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>
          <div className="text-sm font-mono text-[#dc2626]">Punkte: {score}</div>
          <button onClick={handleExit} className="text-sm text-[#a3a3a3] hover:text-white px-3 py-1.5 rounded-lg bg-[#262626] border border-[#444]">
            Abbrechen
          </button>
        </div>
      </div>

      <NarrativePanel narrative={currentNode.narrative} />

      {feedback && (
        <div className={`p-4 rounded-lg border ${feedback.success ? 'bg-green-900/20 border-green-700 text-green-200' : 'bg-red-900/20 border-red-700 text-red-200'}`}>
          {feedback.message}
        </div>
      )}

      <ActionButtons actions={currentNode.actions} onSelect={handleAction} />

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
