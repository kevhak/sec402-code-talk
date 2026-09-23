// allow resource.owner full access to Photos
@id("Photo-owner")
permit (
  principal is PhotoApp::User,
  action in
    [PhotoApp::Action::"viewPhoto",
     PhotoApp::Action::"editPhoto",
     PhotoApp::Action::"deletePhoto"],
  resource in PhotoApp::Application::"PhotoApp"
)
when { resource.owner == principal };