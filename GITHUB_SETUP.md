# Add CareerPilot AI to GitHub

This source package contains the updated React interface, FastAPI backend,
tests, font licenses, setup scripts, and Vercel configuration. Dependencies,
local credentials, databases, uploaded documents, and generated files are excluded.

## Upload using your browser

1. Extract `CareerPilotAI-GitHub.zip` to a new folder.
2. Open https://github.com/new and name the repository `CareerPilotAI`.
3. Choose your preferred visibility. Leave the README, license, and .gitignore
   initialization options unchecked; the source already includes a README and .gitignore.
4. Create the repository. On its empty setup page, select **uploading an existing file**.
   For a repository with files, use **Add file > Upload files**.
5. Drag the extracted files and folders into the upload area, including `.gitignore`.
   Upload the contents, not the ZIP or an extra enclosing folder.
6. Review the file list and save the initial commit with the message
   `Add CareerPilot AI with redesigned interface`.

The repository root should contain `README.md`, `.gitignore`, `frontend/`,
`backend/`, `fine_tuning/`, and the setup scripts. If you see only a ZIP file,
extract it locally and upload its contents instead.

## Alternative: push with Git

Run these commands inside the extracted folder after creating the empty GitHub
repository. Replace `YOUR_USERNAME` with your GitHub username.

```powershell
git init
git add .
git commit -m "Add CareerPilot AI with redesigned interface"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/CareerPilotAI.git
git push -u origin main
```

Git may ask you to sign in to GitHub or configure your commit name and email.
Use your own identity for those settings.

## Vercel settings

When connecting the repository to Vercel, use:

| Setting | Value |
| --- | --- |
| Root directory | `frontend` |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

The current production site is https://careerpilot-ai-three-virid.vercel.app.
Use its existing Vercel project when connecting GitHub for automatic deployments.
Set `VITE_API_URL` to your hosted HTTPS backend URL to enable account and AI
features. See `README.md` for local setup and backend hosting requirements.

## References

- https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-new-repository
- https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
