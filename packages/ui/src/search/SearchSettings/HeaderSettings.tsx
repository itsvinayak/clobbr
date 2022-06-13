import { SyntheticEvent, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import {
  IconButton,
  Typography,
  FormGroup,
  TextField,
  Autocomplete,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Alert
} from '@mui/material';
import { Clear, Delete } from '@mui/icons-material';

import { KNOWN_HEADERS } from 'enums/EKnownHeaders';

import { GlobalStore } from 'App/globalContext';
import { ClobbrUIHeaderItem } from 'models/ClobbrUIHeaderItem';

export const HEADER_MODES = {
  INPUT: 'INPUT',
  SHELL: 'SHELL'
};

export const HeaderSettings = () => {
  const globalStore = useContext(GlobalStore);
  const [lastShellOutput, setLastShellOutput] = useState('');

  const handleHeaderItemKeyChange =
    (header: ClobbrUIHeaderItem) =>
    (_event: SyntheticEvent, newKey: string | null) => {
      globalStore.search.updateHeaderItem({
        ...header,
        key: newKey || ''
      });
    };

  const handleHeaderValueChange =
    (header: ClobbrUIHeaderItem) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      globalStore.search.updateHeaderItem({
        ...header,
        value: event.target.value || ''
      });
    };

  const testShellCmd = async (cmd: string) => {
    const electronAPI = (window as any).electronAPI;

    if (electronAPI) {
      const output = await electronAPI.runShellCmd(cmd);

      if (output) {
        setLastShellOutput(output);
      }
    }
  };

  useEffect(() => {
    const allHeadersHaveAKey = globalStore.search.headerItems.every(
      (header: ClobbrUIHeaderItem) => header.key
    );

    if (allHeadersHaveAKey) {
      globalStore.search.addHeaderItem({
        id: uuidv4(),
        key: '',
        value: '',
        enabled: true
      });
    }
  }, [globalStore.search.headerItems, globalStore.search]);

  return (
    <GlobalStore.Consumer>
      {({ search, themeMode }) => (
        <>
          <Typography
            variant="overline"
            className="opacity-50 flex gap-2 justify-between"
          >
            {/* Set request headers, either static or through a script */}
            Set request headers
            <ToggleButtonGroup
              color={themeMode === 'dark' ? 'primary' : 'secondary'}
              value={search.headerInputMode}
              exclusive
              onChange={(
                _event: React.MouseEvent<HTMLElement>,
                newMode: string
              ) => search.updateHeaderInputMode(newMode)}
              size="small"
              // className="bg-gray-800 dark:bg-gray-200"
            >
              <ToggleButton
                value={HEADER_MODES.INPUT}
                sx={{ textTransform: 'none', padding: '0.25rem 1rem' }}
              >
                Input
              </ToggleButton>
              <ToggleButton
                value={HEADER_MODES.SHELL}
                sx={{ textTransform: 'none', padding: '0.25rem 1rem' }}
              >
                Shell
              </ToggleButton>
            </ToggleButtonGroup>
          </Typography>

          {search.headerInputMode === HEADER_MODES.INPUT ? (
            <div className="flex flex-col gap-3 mt-6">
              {search.headerItems.map((header: ClobbrUIHeaderItem) => (
                <FormGroup key={header.id} className="!grid gap-1 grid-cols-12">
                  <Autocomplete
                    freeSolo
                    forcePopupIcon={false}
                    inputValue={header.key}
                    onInputChange={handleHeaderItemKeyChange(header)}
                    id={`${header.id}-header-autocomplete`}
                    options={Object.values(KNOWN_HEADERS)}
                    renderInput={(params) => (
                      <TextField {...params} label="Header Key" />
                    )}
                    className="col-span-5"
                  />

                  <div className="flex gap-2 col-span-7 items-center">
                    <TextField
                      variant="outlined"
                      label="Value"
                      placeholder=""
                      id={`${header.id}-header-value`}
                      value={header.value}
                      onChange={handleHeaderValueChange(header)}
                      className="w-full"
                      InputProps={{
                        endAdornment: header.value ? (
                          <IconButton
                            size="small"
                            onClick={() => {
                              search.updateHeaderItem({
                                ...header,
                                value: ''
                              });
                            }}
                            className="!p-1 !-mr-2"
                          >
                            <Clear style={{ fontSize: '1.25rem' }} />
                          </IconButton>
                        ) : (
                          ''
                        )
                      }}
                    />

                    <IconButton
                      className="flex-grow-0 flex-shrink-0 !p-1"
                      size="small"
                      onClick={() => {
                        search.removeHeaderItem(header.id);
                      }}
                    >
                      <Delete className="!w-5 !h-5" />
                    </IconButton>
                  </div>
                </FormGroup>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3 mt-6">
              <TextField
                multiline
                minRows={3}
                variant="outlined"
                label="Shell Command"
                placeholder=""
                id="header-shell-cmd-value"
                value={search.headerShellCmd}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  search.updateHeaderShellCmd(event.target.value);
                }}
                className="w-full"
              />

              <Button
                onClick={() => testShellCmd(search.headerShellCmd)}
                color="secondary"
              >
                Test shell command
              </Button>

              {lastShellOutput ? (
                <pre className="bg-white dark:bg-black text-black dark:text-white rounded-md p-4 overflow-auto">
                  <small>{lastShellOutput}</small>
                </pre>
              ) : (
                <></>
              )}

              <Alert severity="info">
                This shell command will be executed before a run. Its output
                will be used as headers.
                <br /> <br />
                The command output should be in JSON format, i.e. one could use
                a shell command to authenticate before sending the request with
                the following output:
                <pre>
                  <small>&gt; /path/to/cmd</small> <br />
                  <small>
                    &gt; &#123; "Authorization": "Bearer ..." &#125;
                  </small>
                </pre>
                <br />
                The shell command could be any executable or script that runs on
                your system.
              </Alert>
            </div>
          )}
        </>
      )}
    </GlobalStore.Consumer>
  );
};
