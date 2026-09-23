// allow entity subjects to view Photos
@id("Photo-subjects")
permit (
  principal is PhotoApp::User,
  action == PhotoApp::Action::"viewPhoto",
  resource in PhotoApp::Application::"PhotoApp"
)
when { resource has subjects && resource.subjects.contains(principal) };