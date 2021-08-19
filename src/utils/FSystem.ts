import { existsSync, promises } from 'fs';
import { resolve } from 'path';
const { readdir, rename, mkdir, rm, unlink } = promises;

/** Contains all methods for fileSystem that needed for `jasmine-zephyr-reporter` */
export class FSystem {
   /**
    *
    * @param path
    * @param newFolderName
    * @description Move all files in a giving folder to a new folder
    * @returns path of the new folder or -1
    */
   public async copyFilesToFolder(path: string, newFolderName: string) {
      if (!existsSync(resolve(path))) return -1;
      const files = await readdir(resolve(path), { withFileTypes: true });
      // Filtering only files
      const filesName: string[] = files
         .filter((content) => content.isFile())
         .map((file) => file.name);

      if (filesName.length > 0) {
         for (const file of filesName) {
            // Create one
            if (!existsSync(resolve(path, newFolderName)))
               await mkdir(resolve(path, newFolderName), { recursive: true });
            await rename(resolve(path, file), resolve(path, newFolderName, file));
         }
         return resolve(path, newFolderName);
      }
      return -1;
   }

   /**
    *
    * @param resultDir
    * @description delete all files in a giving path if exist
    * @returns void
    */
   public async deleteOlcContent(resultDir: string): Promise<void> {
      const path = resolve(resultDir);
      if (existsSync(path)) {
         rm(path, { recursive: true, force: true });
      }
   }

   /**
    *
    * @param path string
    * @param except string[]
    * @description Delete all content in a giving folder. whether is a file or directory
    */
   public async deleteOldContentExcept(path: string, except: string[]) {
      try {
         const resultDir = resolve(path);
         if (existsSync(path)) {
            const files = await readdir(resultDir, { withFileTypes: true });
            const content = {
               files: files.filter((x) => x.isFile()).map((f) => f.name),
               directories: files.filter((x) => x.isDirectory()).map((f) => f.name),
            };
            for (const filename of content.files) {
               if (!except.includes(filename)) {
                  await unlink(resolve(resultDir, filename));
               }
            }
            for (const directory of content.directories) {
               if (!except.includes(directory)) {
                  await rm(resolve(resultDir, directory), {
                     recursive: true,
                     force: true,
                  });
               }
            }
         }
      } catch (error) {
         console.log(error);
      }
   }
}
