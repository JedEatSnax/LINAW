# Repository Conventions to Avoid Confusion

## 0. Learn Shortcuts and Keybinds
Everyone should practice the keybinds and shortcuts of all the software that you will use within your respective operating systems. This will ensure that everyone will be faster in delivering code as we enter the development stage.

## 1. Git and GitHub Security and Verification
For security purposes, go to **GitHub Profile Picture** --> **Settings** --> **Emails** --> and turn on **Keep my email address private**
![Settings Page](assets/github-private-email.png)

Additionally, follow this setup guide to always verify your commits to the repository.
- **YouTube Link:** https://youtu.be/zPENYmyx6ug
- **Article Link:** https://daily-dev-tips.com/posts/how-to-verify-your-commits-on-github/

## 2. Configure Git
Copy and paste your private GitHub email that ends with `noreply.github.com` and configure it to your machine
```
git config --global user.name "Your Username"
git config --global user.email username@github.com
```

## 3. Learn Git Branching
Go to https://learngitbranching.js.org/ to maintain proper versioning. Additionally, some rules must be followed to maintain order:
- Everyone must follow good git branch naming conventions. Learn more from this article: https://medium.com/@abhay.pixolo/naming-conventions-for-git-branches-a-cheatsheet-8549feca2534
- Don't be afraid to make multiple branches and commits. It will be easier to roll back if any of us makes a mistake.
- After merging your branch or your fork, notify me so I can approve the pull request as soon as possible.
- Furthermore, if you are branching, I recommend this format `branch-name/username/title`. For example, `feature/Jed/triple-entry`

### Git Cheatsheet

#### Workflow Commands
```
git add .
git commit -am "A message describing what you have done to make this snapshot different"
```

#### Status and Log Checking
```
git status
git log
```

#### Basic Git Syntax
The basic Git syntax is `program | action | destination`

For example,
- `git add .` is read as `git | add | .`, where the period represents everything in the current directory;
- `git commit -m "message"` is read as `git | commit -m | "message"` and
- `git status` is read as `git | status | (no destination)`. I recommend that you use `git status` everytime you perform a git command to see if there are no conflicts.

#### Branching Commands
Read these articles for more information: 
1. https://stackoverflow.com/questions/6591213/how-can-i-rename-a-local-git-branch
2. https://stackoverflow.com/questions/449541/how-can-i-selectively-merge-or-pick-changes-from-another-branch-in-git

Commands with brief information:
- `git branch -vv` to see all the branches present.
- `git push --set-upstream origin [branch-name]` to set one of your branches upstream. I only recommend this for your development branch that you use for testing.
- `git branch -m [new-name]` to rename the current LOCAL branch.
- `git branch -m [old-name] [new-name]` to LOCALLY rename a branch while pointed in any branch.
- `git push origin -u [branch-name]` to set your LOCAL branch upstream. This would create a new branch if you renamed a branch.
- `git push origin -d` to delete a remote branch.
- If you want to push a specific file from a branch into main, assuming there are no changes into main yet, do `git checkout main` to go into main, then `git checkout [specific-branch] [path/to/file]`, and lastly `git commit -am "..."`.