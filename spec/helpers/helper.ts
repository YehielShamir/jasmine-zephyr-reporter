import {JasmineZephyrReporter} from '../../index';

function createJasmineZephyrReporter () {
    return new JasmineZephyrReporter({
        HostUrl: '',
        auth: {
            username: "",
            password: ""
        },
        projectIdOrKey: "",
        errorHandling: 'silent',
        breakOnBadConnectionKeys: true,
        attachedFileDir: '',
        disable: false,
        boardID: 0,
        options: {
            cycleCreationConfig: {
                createNewCycle: {
                    name: 'This is the new cycle name'
                }
            },
            versionConfiguration: {
                versionName: 'bamboo'
            },
            cycleDeletionConfiguration: {
                deleteOldCycle: true,
                keepCycles: [''],
                keepInHistory: 3
            }
        }
    })
};

jasmine.getEnv().addReporter(createJasmineZephyrReporter());