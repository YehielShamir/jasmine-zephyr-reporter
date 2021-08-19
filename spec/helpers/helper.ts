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
        attachedContentDir: '',
        disable: false,
        boardID: 3828, 
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

