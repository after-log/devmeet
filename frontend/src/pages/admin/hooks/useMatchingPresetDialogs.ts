import { useRef, useState } from 'react';
import { useMatchingMutations } from './useAdminQueries';
import { createMatchingPresetDraft, isMatchingPresetDraftValid } from '../matchingPresets';
import type { MatchingPreset, MatchingPresetDraft } from '../types';
import type useMatchingSettings from './useMatchingSettings';

type Confirmation = { action: 'apply' | 'delete'; preset: MatchingPreset };
export default function useMatchingPresetDialogs({
  data,
  setNotice,
}: ReturnType<typeof useMatchingSettings>) {
  const mutations = useMatchingMutations();
  const [draft, setDraft] = useState<MatchingPresetDraft>(createMatchingPresetDraft);
  const [busy, setBusy] = useState(false);
  const [workspace, setWorkspace] = useState<'edit' | 'select' | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [workspaceError, setWorkspaceError] = useState('');
  const [pending, setPending] = useState<Confirmation | null>(null);
  const [dialogError, setDialogError] = useState('');
  const libraryTitle = useRef<HTMLHeadingElement>(null);
  const workspaceTitle = useRef<HTMLHeadingElement>(null);
  const workspaceTrigger = useRef<HTMLElement | null>(null);
  const dialogTrigger = useRef<HTMLElement | null>(null);
  const editorFromPicker = useRef(false);
  const inFlight = useRef(false);

  const startDraft = (preset?: MatchingPreset, asVersion = false, trigger?: HTMLElement) => {
    if (trigger && !workspace) workspaceTrigger.current = trigger;
    editorFromPicker.current = workspace === 'select';
    setWorkspaceError('');
    setDraft(createMatchingPresetDraft(preset, asVersion));
    setNotice('');
    setWorkspace('edit');
  };
  const openPicker = (trigger: HTMLElement) => {
    workspaceTrigger.current = trigger;
    setSelectedPresetId(data?.activeId ?? '');
    setWorkspaceError('');
    setNotice('');
    setWorkspace('select');
  };
  const save = async (input: MatchingPresetDraft) => {
    if (!isMatchingPresetDraftValid(input) || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setWorkspaceError('');
    setNotice('');
    try {
      const saved = await mutations.create(input);
      setDraft(createMatchingPresetDraft());
      setSelectedPresetId(saved.id);
      setWorkspace('select');
      setNotice(
        `${saved.name} v${saved.version}을 저장했어요. 적용 버튼을 누르면 새 추천부터 사용합니다.`,
      );
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : '프리셋을 저장하지 못했어요.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const openConfirmation = (
    action: Confirmation['action'],
    preset: MatchingPreset,
    trigger: HTMLElement,
  ) => {
    dialogTrigger.current = trigger;
    setDialogError('');
    setPending({ action, preset });
  };
  const confirm = async () => {
    if (!pending || inFlight.current) return;
    const { action, preset } = pending;
    inFlight.current = true;
    setBusy(true);
    setDialogError('');
    setNotice('');
    try {
      if (action === 'delete') {
        await mutations.remove(preset.id);
        if (draft.baseId === preset.id) setDraft(createMatchingPresetDraft());
        if (selectedPresetId === preset.id) setSelectedPresetId(data?.activeId ?? '');
        setNotice(`${preset.name} v${preset.version}을 삭제했어요. 과거 성과 기록은 유지됩니다.`);
      } else {
        await mutations.activate(preset.id);
        setWorkspace(null);
        setNotice(
          `${preset.name} v${preset.version}을 적용했어요. 이미 배정된 오늘의 추천은 유지됩니다.`,
        );
      }
      setPending(null);
    } catch (error) {
      setDialogError(
        error instanceof Error
          ? error.message
          : `프리셋을 ${action === 'delete' ? '삭제' : '적용'}하지 못했어요.`,
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const restoreWorkspaceFocus = () => {
    const trigger = workspaceTrigger.current;
    if (trigger?.isConnected && !trigger.matches(':disabled')) trigger.focus();
    else libraryTitle.current?.focus();
  };
  const restoreConfirmationFocus = () => {
    const trigger = dialogTrigger.current;
    if (trigger?.isConnected && !trigger.matches(':disabled')) trigger.focus();
    else if (workspaceTitle.current?.isConnected) workspaceTitle.current.focus();
    else restoreWorkspaceFocus();
  };
  const closeWorkspace = () => {
    if (!inFlight.current && !pending) setWorkspace(null);
  };
  const closeConfirmation = () => {
    if (!inFlight.current) setPending(null);
  };
  const cancelEditor = () => {
    if (!inFlight.current) setWorkspace(editorFromPicker.current ? 'select' : null);
  };
  return {
    draft,
    setDraft,
    busy,
    workspace,
    selectedPresetId,
    setSelectedPresetId,
    workspaceError,
    pending,
    dialogError,
    libraryTitle,
    workspaceTitle,
    editorFromPicker: editorFromPicker.current,
    startDraft,
    openPicker,
    save,
    openConfirmation,
    confirm,
    restoreWorkspaceFocus,
    restoreConfirmationFocus,
    closeWorkspace,
    closeConfirmation,
    cancelEditor,
  };
}
