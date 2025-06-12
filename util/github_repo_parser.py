import requests
import json
import os
from typing import Dict, List, Optional, Union
from pathlib import Path

class GitHubRepoParser:
    def __init__(self, token: Optional[str] = None):
        self.token = token
        self.headers = {
            'Accept': 'application/vnd.github.v3+json',
        }
        if token:
            self.headers['Authorization'] = f'token {token}'
        
        # Create projects directory if it doesn't exist
        self.projects_dir = Path('src/config/projects')
        self.projects_dir.mkdir(parents=True, exist_ok=True)

    def get_repo_contents(self, owner: str, repo: str, path: str = '') -> List[Dict]:
        """Get contents of a repository path"""
        url = f'https://api.github.com/repos/{owner}/{repo}/contents/{path}'
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()

    def parse_directory(self, owner: str, repo: str, path: str = '') -> Dict:
        """Recursively parse a directory structure"""
        contents = self.get_repo_contents(owner, repo, path)
        result = {
            'name': Path(path).name if path else repo,
            'type': 'directory',
            'children': []
        }

        for item in contents:
            if item['type'] == 'dir':
                result['children'].append(self.parse_directory(owner, repo, item['path']))
            else:
                result['children'].append({
                    'name': item['name'],
                    'type': 'file'
                })

        return result

    def create_project_json(self, owner: str, repo: str, title: str, description: str, 
                          repo_url: str, live_url: str, tech_stack: List[str]) -> Dict:
        """Create a project JSON object in the required format"""
        structure = self.parse_directory(owner, repo)
        
        return {
            'id': repo.lower(),
            'title': title,
            'description': description,
            'repoUrl': repo_url,
            'liveUrl': live_url,
            'techStack': tech_stack,
            'structure': {
                'root': repo,
                'children': structure['children']
            },
            'images': []  # You can add images manually later
        }

    def save_project_json(self, project_json: Dict) -> str:
        """Save project JSON to file and return the relative path"""
        filename = f"{project_json['id']}.json"
        filepath = self.projects_dir / filename
        
        with open(filepath, 'w') as f:
            json.dump(project_json, f, indent=4)
        
        return str(filepath.relative_to('src/config'))
    
def main():
    parser = GitHubRepoParser()
    
    # Example project details
    project_json = parser.create_project_json(
        owner='aabdoo23', #dont forget to change this to your github username
        repo='portfolio', #dont forget to change this to your github repo name
        title='Portfolio (This Website)', #dont forget to change this to your project title
        description='An open source interactive portfolio website, with a clean and modern design, sections for education, experience, skills, competitions, and more. Built with Astro.js, Tailwind CSS, TypeScript, React, and Vercel.', #dont forget to change this to your project description
        repo_url='https://github.com/aabdoo23/portfolio', #dont forget to change this to your github repo url
        live_url='https://aabdoo23.vercel.app', #dont forget to change this to your live website url or leave it blank if you dont have one
        tech_stack=['Astro.js', 'Tailwind CSS', 'TypeScript', 'React', 'Vercel'] #dont forget to change this to your project tech stack
    )

    # Save project JSON and get the path
    project_path = parser.save_project_json(project_json)
    print(f"Project JSON saved to: {project_path}")

if __name__ == '__main__':
    main() 