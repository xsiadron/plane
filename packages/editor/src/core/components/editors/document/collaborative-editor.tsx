import React, { useEffect, useState } from "react";
// components
import { DocumentContentLoader, PageRenderer } from "@/components/editors";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
// extensions
import { IssueWidget } from "@/extensions";
// helpers
import { getEditorClassNames } from "@/helpers/common";
// hooks
import { useCollaborativeEditor } from "@/hooks/use-collaborative-editor";
// types
import { EditorRefApi, ICollaborativeDocumentEditor } from "@/types";

const CollaborativeDocumentEditor = (props: ICollaborativeDocumentEditor) => {
  const {
    onTransaction,
    aiHandler,
    containerClassName,
    disabledExtensions,
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editable,
    editorClassName = "",
    embedHandler,
    fileHandler,
    forwardedRef,
    handleEditorReady,
    id,
    mentionHandler,
    placeholder,
    realtimeConfig,
    serverHandler,
    tabIndex,
    user,
  } = props;

  const extensions = [];
  if (embedHandler?.issue) {
    extensions.push(
      IssueWidget({
        widgetCallback: embedHandler.issue.widgetCallback,
      })
    );
  }

  // use document editor
  const { editor, hasServerConnectionFailed, hasServerSynced, localProvider, hasIndexedDbSynced } =
    useCollaborativeEditor({
      disabledExtensions,
      editable,
      editorClassName,
      embedHandler,
      extensions,
      fileHandler,
      forwardedRef,
      handleEditorReady,
      id,
      mentionHandler,
      onTransaction,
      placeholder,
      realtimeConfig,
      serverHandler,
      tabIndex,
      user,
    });

  const editorContainerClassNames = getEditorClassNames({
    noBorder: true,
    borderOnFocus: false,
    containerClassName,
  });

  const [hasIndexedDbEntry, setHasIndexedDbEntry] = useState(null);

  useEffect(() => {
    async function documentIndexedDbEntry(dbName: string) {
      try {
        const databases = await indexedDB.databases();
        const hasEntry = databases.some((db) => db.name === dbName);
        setHasIndexedDbEntry(hasEntry);
      } catch (error) {
        console.error("Error checking database existence:", error);
        return false;
      }
    }
    documentIndexedDbEntry(id);
  }, [id, localProvider]);

  if (!editor) return null;

  // Wait until we know about IndexedDB status
  if (hasIndexedDbEntry === null) return null;

  if (hasServerConnectionFailed || (!hasIndexedDbEntry && !hasServerSynced) || !hasIndexedDbSynced) {
    return <DocumentContentLoader />;
  }

  return (
    <PageRenderer
      displayConfig={displayConfig}
      aiHandler={aiHandler}
      editor={editor}
      editorContainerClassName={editorContainerClassNames}
      id={id}
      tabIndex={tabIndex}
    />
  );
};

const CollaborativeDocumentEditorWithRef = React.forwardRef<EditorRefApi, ICollaborativeDocumentEditor>(
  (props, ref) => (
    <CollaborativeDocumentEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
  )
);

CollaborativeDocumentEditorWithRef.displayName = "CollaborativeDocumentEditorWithRef";

export { CollaborativeDocumentEditorWithRef };
