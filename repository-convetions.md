# Repository Conventions to Avoid Confusion

## 0. Learn Shortcuts and Keybinds
Everyone should practice the keybinds and shortcuts of all the software that you will use within your respective operating systems. This will ensure that everyone will be faster in delivering code as we enter the development stage.

## 1. Using your private GitHub email
For security purposes, go to `GitHub Profile Picture` --> `Settings` --> `Emails` --> and turn on `Keep my email address private`
![Settings Page](assets/github-private-email.png)

## 2. Configure Git
Copy and paste your private GitHub email that ends with `noreply.github.com` and configure it to your machine
```
git config --global user.name "Your Username"
git config --global user.email username@github.com
```

## 3. Learn Git Branching
Go to https://learngitbranching.js.org/ to maintain proper versioning. Additionally, some rules must be followed to maintain order:
- Everyone must follow good git branch naming conventions. Learn more from this article [HERE](https://medium.com/@abhay.pixolo/naming-conventions-for-git-branches-a-cheatsheet-8549feca2534)
- Don't be afraid to make multiple branches and commits. It will be easier to roll back if any of us makes a mistake.
- After merging your branch or your fork, notify me so I can approve the pull request as soon as possible.

### Git Cheatsheet

#### Workflow Commands
```
git add .
git commit -m "A message describing what you have done to make this snapshot different"
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
- `git status` is read as `git | status | (no destination)`