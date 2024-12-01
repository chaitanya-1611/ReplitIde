import { useEffect, useMemo } from "react";
import Sidebar from "./external/editor/components/sidebar";
import { Code } from "./external/editor/editor/code";
import styled from "@emotion/styled";
import { File, buildFileTree, RemoteFile } from "./external/editor/utils/file-manager";
import { FileTree } from "./external/editor/components/file-tree";
import { Socket } from "socket.io-client";

const Main = styled.main`
  display: flex;
  height: 100%;
  background: #1e1e30;
`;

const SidebarContainer = styled.div`
  width: 250px;
  background: #232334;
  padding: 10px;
  border-right: 1px solid #444;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 4px;
  }
`;

const FileTreeContainer = styled.div`
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    margin: 5px 0;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 4px;
    color: #ddd;
    background: transparent;
    transition: background 0.3s ease;

    &:hover {
      background: #3a3a52;
    }
  }

  .selected {
    background: #0078d7;
    color: #fff;
    font-weight: bold;
  }
`;

const CodeContainer = styled.div`
  flex: 1;
  padding: 15px;
  background: #1e1e2f;
  color: #ddd;
  font-family: "Fira Code", "Courier New", monospace;
  font-size: 14px;
  border-left: 1px solid #444;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 4px;
  }

  textarea {
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    outline: none;
    color: #ddd;
    resize: none;
  }
`;


// credits - https://codesandbox.io/s/monaco-tree-pec7u
export const Editor = ({
  files,
  onSelect,
  selectedFile,
  socket,
}: {
  files: RemoteFile[];
  onSelect: (file: File) => void;
  selectedFile: File | undefined;
  socket: Socket;
}) => {
  const rootDir = useMemo(() => buildFileTree(files), [files]);

  useEffect(() => {
    if (!selectedFile && rootDir.files.length > 0) {
      onSelect(rootDir.files[0]);
    }
  }, [selectedFile, rootDir, onSelect]);

  return (
    <Main>
      <SidebarContainer>
        <FileTreeContainer>
          <FileTree
            rootDir={rootDir}
            selectedFile={selectedFile}
            onSelect={onSelect}
          />
        </FileTreeContainer>
      </SidebarContainer>
      <CodeContainer>
        <Code socket={socket} selectedFile={selectedFile} />
      </CodeContainer>
    </Main>
  );
};
