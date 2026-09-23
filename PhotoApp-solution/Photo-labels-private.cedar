// deny access to private Photos from non-owner
@id("Photo-labels-private")
forbid (
  principal is PhotoApp::User,
  action,
  resource in PhotoApp::Application::"PhotoApp"
)
when { resource.labels.contains("private") }
unless { resource.owner == principal };