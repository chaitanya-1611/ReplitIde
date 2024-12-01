import { useEffect, useState } from 'react';
import { Editor } from './Editor';
import { File, RemoteFile, Type } from './external/editor/utils/file-manager';
import { useSearchParams } from 'react-router-dom';
import styled from '@emotion/styled';
import { Output } from './Output';
import { TerminalComponent as Terminal } from './Terminal';
import { Socket, io } from 'socket.io-client';
import { EXECUTION_ENGINE_URI } from '../config';
const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #1e1e2f, #28293d);
  color: #fff;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 15px;
  background: #33334d;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);

  button {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    background: #0078d7;
    color: white;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    transition: all 0.3s ease;

    &:hover {
      background: #005bb5;
    }
  }
`;

const Workspace = styled.div`
  display: flex;
  flex-grow: 1;
  margin: 0;
  width: 100%;
  overflow: hidden;
`;

const LeftPanel = styled.div`
  flex: 2;
  background: #232334;
  padding: 15px;
  overflow-y: auto;
  border-right: 1px solid #444;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 4px;
  }
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1e1e2f;
  padding: 15px;
  overflow-y: auto;

  & > div {
    margin-bottom: 10px;
  }

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: #444;
    border-radius: 4px;
  }
`;

const TerminalContainer = styled.div`
  flex: 1;
  background: #111;
  border-radius: 5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  padding: 10px;
  color: #00ff00;
  font-family: 'Courier New', Courier, monospace;
`;

const EditorContainer = styled.div`
  flex: 1;
  border-radius: 5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  background: #1e1e30;
  padding: 10px;
  color: #ddd;
`;

function useSocket(replId: string) {
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const newSocket = io(`${EXECUTION_ENGINE_URI}?roomId=${replId}`);
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [replId]);

    return socket;
}

export const CodingPage = () => {
    const [searchParams] = useSearchParams();
    const replId = searchParams.get('replId') ?? '';
    const [loaded, setLoaded] = useState(false);
    const socket = useSocket(replId);
    const [fileStructure, setFileStructure] = useState<RemoteFile[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined);
    const [showOutput, setShowOutput] = useState(false);

    useEffect(() => {
        if (socket) {
            socket.on('loaded', ({ rootContent }: { rootContent: RemoteFile[]}) => {
                setLoaded(true);
                setFileStructure(rootContent);
            });
        }
    }, [socket]);

    const onSelect = (file: File) => {
        if (file.type === Type.DIRECTORY) {
            socket?.emit("fetchDir", file.path, (data: RemoteFile[]) => {
                setFileStructure(prev => {
                    const allFiles = [...prev, ...data];
                    return allFiles.filter((file, index, self) => 
                        index === self.findIndex(f => f.path === file.path)
                    );
                });
            });

        } else {
            socket?.emit("fetchContent", { path: file.path }, (data: string) => {
                file.content = data;
                setSelectedFile(file);
            });
        }
    };
    
    if (!loaded) {
        return "Loading...";
    }

    return (
        <Container>
        <ButtonContainer>
          <button onClick={() => setShowOutput(!showOutput)}>See output</button>
        </ButtonContainer>
        <Workspace>
          <LeftPanel>
            <EditorContainer>
              <Editor
                socket={socket}
                selectedFile={selectedFile}
                onSelect={onSelect}
                files={fileStructure}
              />
            </EditorContainer>
          </LeftPanel>
          <RightPanel>
            {showOutput && (
              <div>
                <Output />
              </div>
            )}
            <TerminalContainer>
              <Terminal socket={socket} />
            </TerminalContainer>
          </RightPanel>
        </Workspace>
      </Container>
      
    );
}
