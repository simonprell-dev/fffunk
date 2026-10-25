import { useState, useEffect, useRef, useMemo } from 'react';
import { Scenario, StoryNode, Action, RadioCall } from '../types/story';
import { StoryEngine } from '../lib/story-engine';
import { AudioEngine } from '../lib/audio-engine';
import NarrativePanel from './NarrativePanel';
import { ActionButtons } from './ActionButtons';
import RadioCallModal from './RadioCallModal';
import { applyRufnamen } from '../lib/rufnamen';
import { RadioResponse, radioResponseFor, splitCall, splitLeadingResponse } from '../lib/radio-response';
import { trackEvent } from '../lib/usage-stats';

interface Props {
  scenario: Scenario;
  engine: StoryEngine;
  audio: AudioEngine;
  onExit: () => void;
  rufnamen?: Record<string, string>;
  mode?: 'guided' | 'training';
}

export default function PracticeScreen({ scenario, engine, audio, onExit, rufnamen, mode = 'guided' }: Props) {
  const [currentNode, setCurrentNode] = useState<StoryNode>(engine.getCurrentNode());
  const [radioModalOpen, setRadioModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [score, setScore] = useState(engine.getProgress().score);
  const [muted, setMuted] = useState(audio.isMuted());
  const [incoming, setIncoming] = useState<RadioResponse | null>(null); // Gegenstelle antwortet gerade

  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const responseSeqRef = useRef(0);       // erhöht → laufende Antwort-Sequenz verwerfen
  const skipLeadingLineRef = useRef(false); // Sprecherzeile des nächsten Schritts wurde schon gesprochen
  const prevNarrativeRef = useRef('');      // vorheriger Schritt – dort kann die Gegenstelle gesprochen haben
  const lastNarrativeRef = useRef('');
  const completionTrackedRef = useRef(false);

  const ruf = rufnamen ?? {};
  const narrative = useMemo(
    () => applyRufnamen(currentNode.narrative, ruf),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentNode.narrative, rufnamen]
  );

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
    responseSeqRef.current++;
    audio.stop();
    onExit();
  };

  // Nach erfolgreichem Funkspruch: erst antwortet die angefunkte Stelle, dann kommt der nächste Schritt.
  const advanceAfterCall = async (call: RadioCall, nextNodeId: string) => {
    const seq = ++responseSeqRef.current;
    const nextNode = engine.getScenario().nodes[nextNodeId];
    const response = nextNode
      ? radioResponseFor(
          applyRufnamen(call.hint, ruf),
          applyRufnamen(nextNode.narrative, ruf),
          call.response,
          `${prevNarrativeRef.current}\n${narrative}`, // letzter Sprecher: bevorzugt aus dem aktuellen Schritt
        )
      : null;

    if (response) {
      setIncoming(response);
      const minDisplay = new Promise(r => setTimeout(r, 1200)); // auch stumm kurz lesbar
      await Promise.all([audio.speakRadio(response.text).catch(() => {}), minDisplay]);
    } else {
      await new Promise(r => setTimeout(r, 800));
    }
    if (seq !== responseSeqRef.current) return;

    skipLeadingLineRef.current = !!response?.fromNarrative;
    setIncoming(null);
    setFeedback(null);
    engine.goTo(nextNodeId);
    refreshNode();
  };

  const handleAction = (action: Action) => {
    audio.stop(); // Ansage des aktuellen Schritts nicht weiterlaufen lassen
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

  const handleRadioResult = (success: boolean, _transcript: string) => {
    setRadioModalOpen(false);
    const action = pendingAction!;
    trackEvent(success ? 'radio_ok' : 'radio_fail');

    if (mode === 'training') {
      // Im Training wurde der Muster-Funkspruch bereits im Modal aufgedeckt –
      // unabhängig vom Treffer geht es zum nächsten Schritt weiter.
      if (success) engine.completeNode(10);
      setFeedback(null);
      advanceAfterCall(action.radioCall!, action.radioCall!.onSuccess);
      return;
    }

    const nextNodeId = success ? action.radioCall!.onSuccess : action.radioCall!.onFailure;

    if (success) {
      engine.completeNode(10);
      setScore(engine.getProgress().score);
      setFeedback({ success: true, message: 'Gut so!' });
      advanceAfterCall(action.radioCall!, nextNodeId);
      return;
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

  // Abschluss = Schritt ohne weitere Handlung außer „Beenden“
  useEffect(() => {
    const isEnd = currentNode.actions.every(a => a.nextNodeId === '__exit__' && !a.radioCall);
    if (isEnd && !completionTrackedRef.current) {
      completionTrackedRef.current = true;
      trackEvent('scenario_complete');
    }
  }, [currentNode]);

  useEffect(() => {
    return () => {
      if (navigationTimerRef.current) clearTimeout(navigationTimerRef.current);
      responseSeqRef.current++;
      audio.stop();
    };
  }, [audio]);

  useEffect(() => {
    if (lastNarrativeRef.current !== narrative) {
      prevNarrativeRef.current = lastNarrativeRef.current;
      lastNarrativeRef.current = narrative;
    }
    let text = narrative;
    if (skipLeadingLineRef.current) {
      skipLeadingLineRef.current = false;
      text = splitLeadingResponse(narrative)?.rest ?? narrative;
    }
    if (text) {
      audio.speakRadio(text).catch(() => {});
    }
  }, [currentNode.id, audio, narrative]);

  return (
    <div className="space-y-6 compact:space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3 compact:gap-1">
        <div className="min-w-0 flex-1 basis-48 compact:basis-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold compact:text-sm compact:leading-tight">{scenario.title}</h2>
            {mode === 'training' && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#1f2a37] text-[#9db4d0] border border-[#2f4256]">
                Trainingsmodus
              </span>
            )}
          </div>
          <p className="text-xs text-[#a3a3a3] hidden sm:block">{scenario.description}</p>
        </div>
        <div className="flex items-center gap-3 compact:gap-2 shrink-0">
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
          <div className="text-sm font-mono text-[#dc2626] whitespace-nowrap">Punkte: {score}</div>
          <button onClick={handleExit} className="text-sm text-[#a3a3a3] hover:text-white px-3 py-1.5 rounded-lg bg-[#262626] border border-[#444] compact:hidden">
            Abbrechen
          </button>
        </div>
      </div>

      <NarrativePanel narrative={narrative} />

      {feedback && (
        <div className={`p-4 compact:p-2 compact:text-sm rounded-lg border ${feedback.success ? 'bg-green-900/20 border-green-700 text-green-200' : 'bg-red-900/20 border-red-700 text-red-200'}`}>
          {feedback.message}
        </div>
      )}

      {incoming ? (
        <div className="p-4 compact:p-2 compact:text-sm rounded-lg border bg-[#1f2a37] border-[#2f4256]">
          <div className="text-sm text-[#9db4d0] mb-1 flex items-center gap-2">
            <span className="animate-pulse">📻</span> {incoming.speaker} antwortet …
          </div>
          <div className="text-[#e5e5e5] italic">„{incoming.text}“</div>
        </div>
      ) : (
        <ActionButtons actions={currentNode.actions} onSelect={handleAction} />
      )}

      {radioModalOpen && pendingAction && (
        <RadioCallModal
          isOpen={true}
          onClose={() => setRadioModalOpen(false)}
          onResult={handleRadioResult}
          mode={mode}
          expectedPhrases={pendingAction.radioCall!.expectedPhrases}
          hint={applyRufnamen(pendingAction.radioCall!.hint, ruf)}
          callSplit={splitCall(
            applyRufnamen(pendingAction.radioCall!.hint, ruf),
            applyRufnamen(engine.getScenario().nodes[pendingAction.radioCall!.onSuccess]?.narrative ?? '', ruf),
          )}
          speak={(text) => audio.speakRadio(text).catch(() => {})}
          briefing={applyRufnamen(pendingAction.radioCall!.briefing ?? '', ruf)}
          feedbackSuccess={applyRufnamen(pendingAction.radioCall!.feedbackSuccess ?? '', ruf)}
          feedbackFailure={applyRufnamen(pendingAction.radioCall!.feedbackFailure ?? '', ruf)}
        />
      )}
    </div>
  );
}
