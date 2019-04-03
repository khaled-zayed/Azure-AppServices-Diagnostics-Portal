import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Commit } from '../../../shared/models/commit';
import { ActivatedRoute } from '@angular/router';
import { GithubApiService } from '../../../shared/services/github-api.service';

@Component({
  selector: 'gist-changelist',
  templateUrl: './gist-changelist.component.html',
  styleUrls: ['./gist-changelist.component.scss']
})
export class GistChangelistComponent implements OnInit {

  @Input() id: string;
  @Input() version: string;
  @Output() change: EventEmitter<object> = new EventEmitter<object>();

  loadingChange: number = 0;
  noCommitsHistory: boolean = false;
  commitsList: Commit[] = [];
  previousSha: string;
  previousCode: string;
  currentSha: string;
  currentCode: string;
  initialized = false;

  constructor(private _route: ActivatedRoute, private githubService: GithubApiService) { }

  setCodeDiffView(commit: Commit) {
    this.version = commit.sha;

    this.githubService.getCommitContent(this.id, commit.sha).subscribe(code => {
      if (code) {
        this.currentSha = commit.sha;
        this.currentCode = code;
        this.change.emit({version: this.version, code: this.currentCode});
      }
    });
  }

  ngOnChanges() {
    if(this.initialized){
      this.initialize();
    }
  }

  ngOnInit() {
    if(!this.initialized){
      this.initialize();
      this.initialized = true;
    }
  }

  private initialize(){
    this.githubService.getChangelist(this.id).subscribe(commits => {
      this.commitsList = commits;
      if (commits && commits.length > 0) {
        let defaultCommit = this.commitsList.filter(c => c.sha == this.version)[0];
        this.setCodeDiffView(defaultCommit);
        this.noCommitsHistory = false;
      }
      else {
        this.noCommitsHistory = true;
      }
    });
  }

  options = {
    theme: 'vs',
    language: 'csharp',
    fontSize: 14,
    automaticLayout: true,
    scrollBeyondLastLine: false,
    minimap: {
      enabled: false
    },
    folding: true
  };
}